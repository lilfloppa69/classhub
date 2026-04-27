const getDisplayName = (user) => {

  if (!user) return "";

  if (user.displayNamePreference === "nickname" && user.nickname) {
    return user.nickname;
  }

  if (user.displayNamePreference === "username" && user.username) {
    return user.username;
  }

  return user.fullName || user.username || "";
};

export default getDisplayName;