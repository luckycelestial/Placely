export * from './students';
import * as students from './students';
export * from './drives';
import * as drives from './drives';
export * from './applications';
import * as applications from './applications';
export * from './analytics';
import * as analytics from './analytics';
export * from './communications';
import * as communications from './communications';
export * from './core';
import * as core from './core';

export const db = {
  ...students,
  ...drives,
  ...applications,
  ...analytics,
  ...communications,
  ...core,
};
