import "server-only";

import * as students from "./services/students";
import * as drives from "./services/drives";
import * as applications from "./services/applications";
import * as analytics from "./services/analytics";
import * as communications from "./services/communications";
import * as core from "./services/core";
import * as settings from "./services/settings";
import * as workflows from "./services/workflows";
import * as infrastructure from "./services/infrastructure";
import { enqueueJob } from "./services/queue";

export const serverServices: Record<string, any> = {
  ...students,
  ...drives,
  ...applications,
  ...analytics,
  ...communications,
  ...core,
  ...settings,
  ...workflows,
  ...infrastructure,
  enqueueJob,
};
