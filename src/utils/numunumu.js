export const NUMUNUMU_TRIGGER = 'numunumu';

export const advanceNumunumuInput = (previousInput, key) =>
  `${previousInput}${key.toLowerCase()}`.slice(-NUMUNUMU_TRIGGER.length);

export const activatesNumunumuMode = (input) => input === NUMUNUMU_TRIGGER;
