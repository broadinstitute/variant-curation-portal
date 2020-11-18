import { actionTypes } from "../actions/userActions";

const userReducer = (state, action) => {
  if (state === undefined) {
    return null;
  }

  switch (action.type) {
    case actionTypes.SET_USER:
      return action.user;
    default:
      return state;
  }
};

export default userReducer;
