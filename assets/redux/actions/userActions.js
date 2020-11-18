import api from "../../api";

export const actionTypes = {
  SET_USER: "SET_USER",
};

export const loadUser = () => dispatch => {
  return api.get("/profile/").then(response => {
    dispatch({
      type: actionTypes.SET_USER,
      user: response.user,
    });
    return response.user;
  });
};
