import Class from "../models/Class.js";
import Assignment from "../models/Assignment.js";

const WEEKDAY_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const pad = (num) => String(num).padStart(2, "0");

const formatDateKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
};

const normalizeMonthParam = (monthParam) => {
  if (/^\d{4}-\d{2}$/.test(monthParam || "")) {
    const [year, month] = monthParam.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

const getMonthRange = (monthParam) => {
  const base = normalizeMonthParam(monthParam);

  const start = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(
    base.getFullYear(),
    base.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return {
    year: base.getFullYear(),
    monthIndex: base.getMonth(),
    monthKey: `${base.getFullYear()}-${pad(base.getMonth() + 1)}`,
    start,
    end,
  };
};

const getDatesForWeekdayInMonth = (year, monthIndex, weekdayName) => {
  const weekdayIndex = WEEKDAY_INDEX[String(weekdayName || "").toLowerCase()];
  if (weekdayIndex === undefined) return [];

  const lastDate = new Date(year, monthIndex + 1, 0).getDate();
  const result = [];

  for (let day = 1; day <= lastDate; day += 1) {
    const current = new Date(year, monthIndex, day);
    if (current.getDay() === weekdayIndex) {
      result.push(current);
    }
  }

  return result;
};

const getTeacherName = (teacher) => {
  return (
    teacher?.displayName ||
    teacher?.fullName ||
    teacher?.nickname ||
    teacher?.username ||
    teacher?.email ||
    "Teacher"
  );
};

export const getCalendarOverview = async (req, res) => {
  try {
    const { month } = req.query;
    const { year, monthIndex, monthKey, start, end } = getMonthRange(month);
    const userId = req.user._id;
    const isTeacher = req.user.role === "teacher";

    const classFilter = isTeacher
      ? {
          $or: [{ teacher: userId }, { coTeachers: userId }],
        }
      : {
          students: userId,
        };

    const joinedClasses = await Class.find(classFilter)
      .populate(
        "teacher",
        "fullName username nickname email displayName avatar",
      )
      .select("title subject teacher coTeachers students schedule");

    const classIds = joinedClasses.map((item) => item._id);

    const classEvents = [];

    for (const joinedClass of joinedClasses) {
      const schedules = Array.isArray(joinedClass.schedule)
        ? joinedClass.schedule
        : [];

      for (const scheduleItem of schedules) {
        const matchedDates = getDatesForWeekdayInMonth(
          year,
          monthIndex,
          scheduleItem.day,
        );

        for (const dateObj of matchedDates) {
          classEvents.push({
            id: `class-${joinedClass._id}-${formatDateKey(dateObj)}-${
              scheduleItem.startTime || "00:00"
            }`,
            type: "class",
            title: joinedClass.subject || joinedClass.title || "Class Session",
            description: joinedClass.title || joinedClass.subject || "Class",
            date: formatDateKey(dateObj),
            startTime: scheduleItem.startTime || "",
            endTime: scheduleItem.endTime || "",
            classId: joinedClass._id,
            classTitle: joinedClass.title || "",
            subject: joinedClass.subject || "",
            teacherName: getTeacherName(joinedClass.teacher),
          });
        }
      }
    }

    const assignmentFilter = isTeacher
      ? {
          classId: { $in: classIds },
          dueDate: { $gte: start, $lte: end },
        }
      : {
          classId: { $in: classIds },
          dueDate: { $gte: start, $lte: end },
          assignedStudents: userId,
        };

    const assignments = await Assignment.find(assignmentFilter)
      .populate("classId", "title subject")
      .select("title dueDate classId maximumScore");

    const assignmentEvents = assignments.map((assignment) => ({
      id: `assignment-${assignment._id}`,
      type: "assignment",
      title: assignment.title || "Assignment Due",
      description:
        assignment.classId?.title || assignment.classId?.subject || "",
      date: formatDateKey(assignment.dueDate),
      startTime: "",
      endTime: "",
      dueAt: assignment.dueDate,
      classId: assignment.classId?._id || null,
      classTitle: assignment.classId?.title || "",
      subject: assignment.classId?.subject || "",
      maximumScore: assignment.maximumScore || 0,
    }));

    const events = [...classEvents, ...assignmentEvents].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);

      if ((a.startTime || "") !== (b.startTime || "")) {
        return (a.startTime || "").localeCompare(b.startTime || "");
      }

      return a.title.localeCompare(b.title);
    });

    const agendaByDate = {};
    const eventCounts = {};

    for (const event of events) {
      if (!agendaByDate[event.date]) {
        agendaByDate[event.date] = [];
      }

      agendaByDate[event.date].push(event);
      eventCounts[event.date] = (eventCounts[event.date] || 0) + 1;
    }

    return res.status(200).json({
      success: true,
      message: "Calendar overview fetched successfully",
      data: {
        month: monthKey,
        range: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        summary: {
          totalEvents: events.length,
          totalClassSessions: classEvents.length,
          totalAssignmentDue: assignmentEvents.length,
        },
        events,
        agendaByDate,
        eventCounts,
      },
    });
  } catch (error) {
    console.error("GET CALENDAR OVERVIEW ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch calendar overview",
    });
  }
};
