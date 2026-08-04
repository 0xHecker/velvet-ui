export const composeEventHandlers = (
  consumerHandler,
  internalHandler,
  { checkForDefaultPrevented = true } = {}
) => {
  if (!consumerHandler) return internalHandler;
  if (!internalHandler) return consumerHandler;

  return (...args) => {
    consumerHandler(...args);
    const event = args[0];
    if (!checkForDefaultPrevented || !event?.defaultPrevented) {
      internalHandler(...args);
    }
  };
};
