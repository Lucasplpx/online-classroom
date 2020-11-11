import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../../utils/database';

interface ErrorResponseType {
  error: string;
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponseType | Record<string, unknown>[]>
): Promise<void> => {
  if (req.method === 'GET') {
    const { courses } = req.query;

    if (!courses) {
      return res
        .status(400)
        .json({ error: 'Missing course name on request body' });
    }

    const { db } = await connect();

    const response = await db
      .collection('users')
      .find({ courses: { $in: [new RegExp(`^${courses}`, 'i')] } })
      .toArray();

    if (response.length === 0) {
      return res.status(400).json({ error: 'Course not found' });
    }

    return res.json(response);
  }

  return res.status(400).json({ error: 'Wrong request method' });
};
