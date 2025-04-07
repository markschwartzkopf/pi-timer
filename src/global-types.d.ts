export type ErrorData =
  | { [k: string]: number | string | boolean | errorData }
  | (number | string | boolean | errorData)[];
export type ServerMessage = {
  props?: TimerProps;
  text?: ClientText;
  state?: TimerState;
  settings?: TimerSettings;
  ipAddress?: string;
  canReboot?: boolean;
  message?: { message: string; warning: boolean };
};
export type TimerProps = {
  startTime: number;
};
export type TimerState = 'running' | 'finished' | 'ready' | 'paused';
export type TimerSettings = {
  timeSize: number;
  messageSize: number;
  yellow: number | null;
  red: number | null;
  warning: number | null;
  flash: boolean;
};
export type ClientText = {
  time: string;
  message?: string;
  state: 'normal' | 'yellow' | 'red' | 'warning';
};

export type ClientMessage =
  | {
      type: 'start';
    }
  | {
      type: 'pause';
    }
  | {
      type: 'reset';
    }
  | {
      type: 'minuteUp';
    }
  | {
      type: 'minuteDown';
    }
  | {
      type: 'setMinutes';
      minutes: number;
    }
  | {
      type: 'secondUp';
    }
  | {
      type: 'secondDown';
    }
  | {
      type: 'modifyTime';
      change: number;
    }
  | {
      type: 'messageSizePlus';
    }
  | {
      type: 'messageSizeMinus';
    }
  | {
      type: 'sendMessage';
      message: string;
      warning: boolean;
    }
  | {
      type: 'setSetting';
      setting: keyof TimerSettings;
      value: number | null;
    }
  | {
      type: 'reboot';
    };

/* | {
			type: 'changeShift';
			weekIndex: number;
			dayIndex: number;
			shiftIndex: number;
			shift: Shift;
	  }
	| {
			type: 'deleteShift';
			weekIndex: number;
			dayIndex: number;
			shiftIndex: number;
	  }
	| { type: 'newWeek' } */
