import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import Class from "../models/Class.js";
import Assignment from "../models/Assignment.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI / MONGODB_URI is missing");
  process.exit(1);
}

const sameId = (a, b) => String(a) === String(b);

async function run() {
  await mongoose.connect(MONGO_URI);

  const teachers = await User.find({ role: "teacher" }).select("_id");
  const teacherIds = teachers.map((teacher) => teacher._id);
  const teacherIdSet = new Set(teacherIds.map(String));

  const classes = await Class.find({
    $or: [
      { teacher: { $in: teacherIds } },
      { students: { $in: teacherIds } },
      { coTeachers: { $in: teacherIds } },
    ],
  });

  let fixedClasses = 0;
  let fixedAssignments = 0;

  for (const cls of classes) {
    const ownerId = String(cls.teacher);

    const wrongTeacherStudentIds = cls.students.filter((studentId) =>
      teacherIdSet.has(String(studentId)),
    );

    const coTeacherIdsToAdd = wrongTeacherStudentIds.filter(
      (teacherId) => !sameId(teacherId, ownerId),
    );

    const teacherIdsToRemoveFromStudentArea = wrongTeacherStudentIds.map(
      (id) => id,
    );

    const beforeStudents = cls.students.length;
    const beforeCoTeachers = cls.coTeachers?.length || 0;

    cls.students = cls.students.filter(
      (studentId) => !teacherIdSet.has(String(studentId)),
    );

    if (!Array.isArray(cls.coTeachers)) {
      cls.coTeachers = [];
    }

    for (const teacherId of coTeacherIdsToAdd) {
      const alreadyCoTeacher = cls.coTeachers.some((id) =>
        sameId(id, teacherId),
      );

      if (!alreadyCoTeacher) {
        cls.coTeachers.push(teacherId);
      }
    }

    cls.coTeachers = cls.coTeachers.filter(
      (teacherId) => !sameId(teacherId, ownerId),
    );

    const afterStudents = cls.students.length;
    const afterCoTeachers = cls.coTeachers.length;

    if (
      beforeStudents !== afterStudents ||
      beforeCoTeachers !== afterCoTeachers
    ) {
      await cls.save();
      fixedClasses += 1;
    }

    if (teacherIdsToRemoveFromStudentArea.length > 0) {
      const result = await Assignment.updateMany(
        { classId: cls._id },
        {
          $pull: {
            assignedStudents: { $in: teacherIdsToRemoveFromStudentArea },
            submissions: {
              student: { $in: teacherIdsToRemoveFromStudentArea },
            },
          },
        },
      );

      fixedAssignments += result.modifiedCount || 0;
    }
  }

  console.log("Repair complete");
  console.log("Fixed classes:", fixedClasses);
  console.log("Fixed assignment documents:", fixedAssignments);

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
