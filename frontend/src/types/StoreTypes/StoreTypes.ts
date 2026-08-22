import { RoleType } from "../UserTypes/UserTypes";

export type LanguageType = "en" | "de" | "it" | "ru";


export type ListErrorKeyType = '' | 'forbidden' | 'loadUsersFailed';
export type DetailErrorKeyType = '' | 'forbidden' | 'loadUserFailed';
export type SaveErrorKeyType = '' | 'forbidden' | 'saveFailed';
export type DeleteErrorKeyType = '' | 'forbidden' | 'deleteFailed';

export interface AdminUserType {
	id: number;
	Username: string;
	Email: string;
	role: RoleType;
}



export interface AdminUpdateType {
  Username: string;
  Email: string;
  Password?: string;
  role?: RoleType;
}

export type Mode = "AI" | "online";

export interface CardsType  {
	title: string;
	description: string;
	button: string;
	wait: string;
	mode: Mode;
}

export interface TranslationTypes {
  
		Header: {
			a: string;
			f: string;
			plaseholder:string;
			invite: string;
			si: string;
			su: string;
		},
		HomePage: {
			title: string;
			choice: string;
			motoFirst: string;
			motoSecond: string;
			description: string;
			sBtn: string;
			cards: CardsType[],
		},
		Profile: {
			language: LanguageType[];
			epBtn: string;
			sub: string;
			preferences: string;
			settings: {
				lang: string;
				ct: string;
				da: string;
				lo: string;
				message: string;
				sound: string;
				avatar: string;
				snakeColor: string;
				username: { 
            label: string;
            edit: string;
        },
				account: {
					yes: string;
					no: string;
					text: string;
					account: string;
				},
				secure: {
					label1: string;
					label2: string;
					changePassword: string;
					close: string;
					newPassword: string;
					oldPassword: string;
				},
			},
		},
		Arena: {
			header: {
				match: string;
				time: string;
				players: string;
				score: string;
				difficulty: string;
				copy: string;
				copied: string;
			},
			saidBar: {
				onlinePlayers: string;
				online: string;
				invited: string;
				position: {
					your: string;
					of: string;
					position: string;
					join: string;
					ignore: string;
				},
			},
			invite: { 
        title: string;
        subtitle: string; 
      },
			board: {
				WAITING:  string; 
				PLAYING:  string; 
				STARTING:  string; 
				FINISHED:  string; 
				connecting:  string; 
			},
			control: { move: string;  pause:  string;  },
			overlay: { win:  string;  over:  string;  tryAgain:  string; },
		},
		History: { you:  string;  won:  string;  los:  string;  pts:  string;  },
		Admin: {
			title:  string; 
			searchPlaceholder:  string; 
			searching:  string; 
			search:  string; 
			noUsersFound:  string; 
			viewEdit:  string; 
			loadingUser:  string; 
			edit:  string; 
			errors: {
				forbidden:  string; 
				loadUsersFailed:  string; 
				loadUserFailed:  string; 
			},
			form: {
				username: string; 
				email:  string; 
				password: string; 
				newPassword:  string; 
				role: string; 
				cannotChangeOwnRole:  string; 
				save:  string; 
				saving:  string; 
				cancel:  string; 
				delete:  string; 
				deleteConfirmText:  string; 
				yesDelete:  string; 
				deleting:  string; 
				no:  string; 
				errors: {
					forbidden: string; 
					saveFailed:  string; 
					deleteFailed:  string; 
				},
			},
		},
		contact: {
			contact:  string;
			send:  string;
			title:  string;
			des:  string;
			invites: string;
		},
		Friends: {
			social:  string; 
			friends:  string; 
			pending:  string; 
			accept:  string; 
			reject:  string; 
			delete:  string; 
			empty:  string; 
			cancel: string; 
		},
};

