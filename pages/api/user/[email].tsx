import { NextApiRequest, NextApiResponse } from 'next';
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

  // SHOW USER PROFILE
  if (req.method === 'GET') {
    const { email } = req.query;

    if (!email) {
      return res
        .status(400)
        .json({ error: 'Missing User email on request body' });
    }

    const { db } = await connect();

    const response = await db.collection('users').findOne({ email });

    if (!response) {
      return res.status(400).json({ error: 'User with this email not found' });
    }

    return res.json(response);
  }

  return res.status(400).json({ error: 'Wrong request method' });
};
