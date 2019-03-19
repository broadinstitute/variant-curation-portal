const getCookie = name => {
  if (!document.cookie || document.cookie === "") {
    return null;
  }

  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i += 1) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(`${name}=`)) {
      const cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
      return cookieValue;
    }
  }

  return null;
};

export default getCookie;
