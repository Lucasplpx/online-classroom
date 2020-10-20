import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/client';
import { ObjectID } from 'mongodb';
import connect from '../../utils/database';

interface ErrorResponseType {
  error: string;
}

interface SuccessResponseType {
  date: string;
  teacher_name: string;
  teacher_id: string;
  student_name: string;
  student_id: string;
  course: string;
  location: string;
  appointment_link: string;
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponseType | SuccessResponseType>
): Promise<void> => {
  if (req.method === 'POST') {
    const session = await getSession({ req });

    if (!session) {
      return res.status(401).json({ error: 'Please login first' });
    }

    const {
      date,
      teacher_name,
      teacher_id,
      student_name,
      student_id,
      course,
      location,
      appointment_link,
    } = req.body;

    if (
      !date ||
      !teacher_name ||
      !teacher_id ||
      !student_name ||
      !student_id ||
      !course ||
      !location
    ) {
      return res
        .status(400)
        .json({ error: 'Missing parameter on request body' });
    }

    const { db } = await connect();

    const teacherExists = await db
      .collection('users')
      .findOne({ _id: new ObjectID(teacher_id) });

    if (!teacherExists) {
      return res.status(400).json({
        error: `Teacher ${teacher_name} with ID ${teacher_id} does not exist`,
      });
    }

    const studentExists = await db
      .collection('users')
      .findOne({ _id: new ObjectID(student_id) });

    if (!studentExists) {
      return res.status(400).json({
        error: `Student ${student_name} with ID ${student_id} does not exist`,
      });
    }

    const appointment = {
      date,
      teacher_name,
      teacher_id,
      student_name,
      student_id,
      course,
      location,
      appointment_link: appointment_link || '',
    };

    await db
      .collection('users')
      .updateOne(
        { _id: new ObjectID(teacher_id) },
        { $push: { appointments: appointment } }
      );

    await db
      .collection('users')
      .updateOne(
        { _id: new ObjectID(student_id) },
        { $push: { appointments: appointment } }
      );

    return res.status(200).json(appointment);
  }

  return res.status(400).json({ error: 'Wrong request method' });
};
