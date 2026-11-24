export const PAGEANT_STATUSES = ["SETUP", "REGISTRATION", "JUDGING", "COMPLETE"];

export const STATUS_INFO = {
  SETUP: {
    label: "Setup",
    help: "Configure age groups, questions, events and criteria. Contestants cannot register yet.",
  },
  REGISTRATION: {
    label: "Registration open",
    help: "Invited contestants can register and edit their bio.",
  },
  JUDGING: {
    label: "Judging",
    help: "Registration is locked. Judges can enter scores and feedback.",
  },
  COMPLETE: {
    label: "Complete",
    help: "Scoring is locked. Publish results to let contestants see their scores and feedback.",
  },
};

export const QUESTION_TYPES = {
  SHORT_TEXT: "Short answer",
  LONG_TEXT: "Paragraph",
};

export const INVITE_ROLES = {
  CONTESTANT: "Contestant",
  JUDGE: "Judge",
};

export const SESSION_COOKIE = "sc_session";
export const SESSION_TTL_DAYS = 30;
