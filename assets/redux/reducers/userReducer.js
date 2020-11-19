import { actionTypes } from "../actions/userActions";

const userReducer = (state, action) => {
  if (state === undefined) {
    return null;
  }

  switch (action.type) {
    case actionTypes.SET_USER:
      return action.user;
    case actionTypes.SET_USER_SETTINGS:
      return {
        ...state,
        settings: action.settings,
      };
    default:
      return state;
  }
};

export default userReducer;
