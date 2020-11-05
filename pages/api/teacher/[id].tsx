import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectID } from 'mongodb';
import connect from '../../../utils/database';

interface ErrorResponseType {
  error: string;
}

interface SuccessResponseType {
  _id: string;
  name: string;
  email: string;
  cellphone: string;
  teacher: true;
  coins: 1;
  courses: string[];
  available_hours: Record<string, number[]>;
  available_locations: string[];
  reviews: Record<string, unknown>[];
  appointments: Record<string, unknown>[];
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponseType | SuccessResponseType>
): Promise<void> => {
  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id) {
      return res
        .status(400)
        .json({ error: 'Missing teacher ID on request body' });
    }

    const { db } = await connect();

    const response = await db
      .collection('users')
      .findOne({ _id: new ObjectID(id) });

    if (!response) {
      return res.status(400).json({ error: 'Teacher not found' });
    }

    return res.json(response);
  }

  return res.status(400).json({ error: 'Wrong request method' });
};
