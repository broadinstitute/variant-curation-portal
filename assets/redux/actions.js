import api from "../api";

export const actionTypes = {
  SET_RESULT: "SET_RESULT",
  SET_RESULT_ERRORS: "SET_RESULT_ERRORS",
};

export const setResult = (result, reset = false) => ({
  type: actionTypes.SET_RESULT,
  result,
  reset,
});

export const saveResult = (result, projectId, variantId) => dispatch => {
  return api.post(`/project/${projectId}/variant/${variantId}/curate/`, result).then(
    () => {
      dispatch({
        type: actionTypes.SET_RESULT,
        result,
      });
    },
    error => {
      dispatch({
        type: actionTypes.SET_RESULT_ERRORS,
        errors: error.data,
      });

      throw error;
    }
  );
};
