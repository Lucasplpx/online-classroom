import { NextApiRequest, NextApiResponse } from 'next';
import connect from '../../utils/database';

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
  available_hours: object;
  available_locations: string[];
  reviews: object[];
  appointments: object[];
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponseType | SuccessResponseType>
): Promise<void> => {
  if (req.method === 'POST') {
    const {
      name,
      email,
      cellphone,
      teacher,
      courses,
      available_hours,
      available_locations,
    } = req.body;

    if (!teacher) {
      if (!name || !email || !cellphone) {
        return res.status(400).json({ error: 'Missing body parameter' });
      }
    } else if (teacher) {
      if (
        !name ||
        !email ||
        !cellphone ||
        !courses ||
        !available_hours ||
        !available_locations
      ) {
        return res.status(400).json({ error: 'Missing body parameter' });
      }
    }

    const { db } = await connect();
    const response = await db.collection('users').insertOne({
      name,
      email,
      cellphone,
      teacher,
      coins: 1,
      courses: courses || [],
      available_hours: available_hours || {},
      available_locations: available_locations || [],
      reviews: [],
      appointments: [],
    });

    return res.status(200).json(response.ops[0]);
  }

  if (req.method === 'GET') {
    const { email } = req.body;

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
