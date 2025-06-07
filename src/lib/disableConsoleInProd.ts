if (process.env.NODE_ENV !== 'development') {
  // eslint-disable-next-line no-global-assign
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};
} 