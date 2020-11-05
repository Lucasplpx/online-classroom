import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/client';
import { ObjectID } from 'mongodb';
import connect from '../../utils/database';

interface User {
  name: string;
  email: string;
  cellphone: string;
  teacher: boolean;
  coins: number;
  courses: string[];
  available_hours: Record<string, number[]>;
  available_locations: string[];
  reviews: Record<string, unknown>[];
  appointments: {
    date: string;
  }[];
  _id: string;
}

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
    }: {
      date: string;
      teacher_name: string;
      teacher_id: string;
      student_name: string;
      student_id: string;
      course: string;
      location: string;
      appointment_link: string;
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

    // check if teacher_id or student_id is invalid
    let testTeacherID: ObjectID;
    let testStudentID: ObjectID;
    try {
      testTeacherID = new ObjectID(teacher_id);
      testStudentID = new ObjectID(student_id);
    } catch {
      return res.status(400).json({ error: 'Wrong' });
    }

    const parsedDate = new Date(date);
    const now = new Date();
    const today = {
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
    };
    const fullDate = {
      day: parsedDate.getDate(),
      month: parsedDate.getMonth(),
      year: parsedDate.getFullYear(),
    };

    // check if requested date is on the past
    if (
      fullDate.year < today.year ||
      fullDate.month < today.month ||
      fullDate.day < today.day
    ) {
      return res.status(400).json({
        error: 'You can´t create appointments on the past',
      });
    }

    const { db } = await connect();

    // check if teacher exists
    const teacherExists: User = await db
      .collection('users')
      .findOne({ _id: new ObjectID(teacher_id) });

    if (!teacherExists) {
      return res.status(400).json({
        error: `Teacher ${teacher_name} with ID ${teacher_id} does not exist`,
      });
    }

    // check if student exists
    const studentExists: User = await db
      .collection('users')
      .findOne({ _id: new ObjectID(student_id) });

    if (!studentExists) {
      return res.status(400).json({
        error: `Student ${student_name} with ID ${student_id} does not exist`,
      });
    }

    // check if student have enough coins
    if (studentExists.coins === 0) {
      return res.status(400).json({
        error: `Student ${student_name} does not have enough coins`,
      });
    }

    // check if requested day/hour is available for the teacher
    const weekdays = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    const requestedDay = weekdays[parsedDate.getDay()];
    const requestedHour = parsedDate.getUTCHours() - 3;
    if (!teacherExists.available_hours[requestedDay]?.includes(requestedHour)) {
      return res.status(400).json({
        error: `Teacher ${teacher_name} is not available at ${requestedDay} ${requestedHour}:00`,
      });
    }

    // check if teacher already have an appointment on the requested day of the month
    teacherExists.appointments.forEach((appointment) => {
      const appointmentDate = new Date(appointment.date);

      if (appointmentDate.getTime() === parsedDate.getTime()) {
        return res.status(400).json({
          error: `Teacher ${teacher_name} already have an appointment at ${appointmentDate.getDate()}/${
            appointmentDate.getMonth() + 1
          }/${appointmentDate.getFullYear()} ${
            appointmentDate.getUTCHours() - 3
          }:00`,
        });
      }
    });

    // create appointment object
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

    // update teacher appointments
    await db
      .collection('users')
      .updateOne(
        { _id: new ObjectID(teacher_id) },
        { $push: { appointments: appointment }, $inc: { coins: 1 } }
      );

    // update student appointments
    await db
      .collection('users')
      .updateOne(
        { _id: new ObjectID(student_id) },
        { $push: { appointments: appointment }, $inc: { coins: -1 } }
      );

    return res.status(200).json(appointment);
  }

  return res.status(400).json({ error: 'Wrong request method' });
};
