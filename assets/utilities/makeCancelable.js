const makeCancelable = promise => {
  let isCanceled = false;
  const wrapper = new Promise((resolve, reject) => {
    promise.then(
      value => {
        if (!isCanceled) {
          resolve(value);
        }
      },
      error => {
        if (!isCanceled) {
          reject(error);
        }
      }
    );
  });

  wrapper.cancel = () => {
    isCanceled = true;
  };

  return wrapper;
};

export default makeCancelable;
