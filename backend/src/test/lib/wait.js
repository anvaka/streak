module.exports = wait;

function wait(ms) {
  return (...args) => {
    return new Promise(resolve => {
      setTimeout(() => resolve(...args), ms);
    });
  };
}
