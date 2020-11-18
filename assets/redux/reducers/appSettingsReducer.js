import { actionTypes } from "../actions/appActions";

const appSettingsReducer = (state, action) => {
  if (state === undefined) {
    return null;
  }

  switch (action.type) {
    case actionTypes.SET_APP_SETTINGS:
      return action.settings;
    default:
      return state;
  }
};

export default appSettingsReducer;
