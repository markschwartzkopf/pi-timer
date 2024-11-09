export type ErrorData =
  | { [k: string]: number | string | boolean | errorData }
  | (number | string | boolean | errorData)[];
export type ServerMessage = {
  props?: TimerProps;
  text?: ClientText;
  state?: TimerState;
  settings?: TimerSettings;
  ipAddress?: string;
  message?: { message: string; flashing: boolean };
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
  flash: number | null;
};
export type ClientText = {
  time: string;
  message?: string;
  state: 'normal' | 'yellow' | 'red' | 'flashing';
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
      type: 'secondUp';
    }
  | {
      type: 'secondDown';
    }
  | {
      type: 'plusMinute';
    }
  | {
      type: 'minusMinute';
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
      flashing: boolean;
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
