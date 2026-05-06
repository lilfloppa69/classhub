export const isTeacherRole = (user) => user?.role === "teacher";

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (value._id) return String(value._id);

  return String(value);
};

export const isClassOwner = (foundClass, userId) => {
  return getId(foundClass?.teacher) === getId(userId);
};

export const isCoTeacher = (foundClass, userId) => {
  return (foundClass?.coTeachers || []).some(
    (teacher) => getId(teacher) === getId(userId),
  );
};

export const isClassTeacher = (foundClass, userId) => {
  return isClassOwner(foundClass, userId) || isCoTeacher(foundClass, userId);
};

export const isClassStudent = (foundClass, userId) => {
  return (foundClass?.students || []).some(
    (student) => getId(student) === getId(userId),
  );
};

export const canAccessClass = (foundClass, userId) => {
  return (
    isClassTeacher(foundClass, userId) || isClassStudent(foundClass, userId)
  );
};
