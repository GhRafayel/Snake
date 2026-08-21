import { create } from "zustand";
import { LanguageType, TranslationTypes } from "@/src/types/StoreTypes/StoreTypes";

interface LanguageStoreType {
    language: LanguageType | "en",
    translations: TranslationTypes,
    setLanguage: (key: LanguageType ) => void;
}

export const LanguageStore = create<LanguageStoreType>((set) => ({
    language: "en",
    translations :  {
        "Header": {
            "a":"Arena",
            "f":"Friends",
            "plaseholder": "players",
            "invite": "Envite",
            "si":"Sign In",
            "su":"Sign Up"
        },
        "HomePage": {
            "title":"BUILT FOR REAL-TIME COMBAT",
            "choice": "Pick how you'd like to pla",
            "motoFirst":"SLITHER.STRIKE.",
            "motoSecond":"SURVIVE.",
            "description":"A multiplayer snake battleground where four serpents enter, one slithers out. Real-time. Cross-platform. No mercy.",
            "sBtn": "Start Playing",
            "cards": [
                {
                    "title": "vs AI",
                    "description": "Quick solo match. No waiting.",
                    "button": "Start match",
                    "wait": "Instant",
                    "mode": "AI",
                },
                {
                    "title": "Quick Match",
                    "description": "Online matchmaking, balanced by rating.",
                    "button": "Find match",
                    "wait": "avg. wait ~8s",
                    "mode": "online"  ,
                },
            ]
        },
        "Profile": {
            "language" : ["en", "de", "it", "ru"],
            "epBtn": "edit profile",
            "sub": "submit",
            "preferences": "Preferences",
            "settings": {
                "lang": "Language",
                "ct": "Color theme",
                "da": "Delete account",
                "lo": "Logout",
                "sound" : "Sound & music",
                "message" : "The request could not be completed",
                "avatar" : "Avatar",
                "snakeColor" : "Snake color",
                "username" : {
                    "label" : "Username",
                    "edit" : "Edit"
                },
                "account" : {
                    "yes" : "Yes",
                    "no" : "No",
                    "text": "Are you sure you want to delete your account?",
                    "account" : "Account",
                    
                },
                "secure": {
                    "label1": "Secure",
                    "label2": "change password, 2FA",
                    "changePassword" : "Change",
                    "close" : "Close",
                    newPassword: "New Passwort",
                    oldPassword: "Old Passwort",
                }
            }
        },
        "Arena": {
            "header" : {
                "match" : "Live Match · Room",
                "time" : "Time",
                "players" : "Players",
                "score" : "Your Score",
                "difficulty" : "Difficulty",
                "copy" : "Copy room ID",
                "copied" : "Copied",
            },
            "saidBar" : {
                    "onlinePlayers" : "ONLINE PLAYERS",
                    "online" : "online",
                    "invited" : "Invited",
                    "position": {
                        "your" : "Your",
                        "of" : "of",
                        "position" : "Position",
                            "join" : "Join",
                            "ignore" : "Ignore"
                    }
            },
            "invite" : {
                "title" : "Match Invite",
                "subtitle" : "invited you to a match"
            },
            "board" : {
                "WAITING" : "Waiting",
                "PLAYING" : "Playing",
                "STARTING" : "Starting",
                "FINISHED" : "Finished",
                "connecting" : "Searching for a room...",
            },
            "control" : {
                "move" : "Move",
                "pause" : "Pause"
            },
            "overlay": {
                "win": "You Win!",
                "over": "Game Over",
                "tryAgain": "Try Again"
            }
        },
        "History" : {
            "you" : "you",
            "won" : "Won",
            "los" : "Los",
            "pts" : "Pts"
        },
        "Admin": {
            "title": "Admin Panel",
            "searchPlaceholder": "Search by name or email",
            "searching": "Searching...",
            "search": "Search",
            "noUsersFound": "No users found.",
            "viewEdit": "View/Edit",
            "loadingUser": "Loading user...",
            "edit": "Edit",
            "errors": {
                "forbidden": "Forbidden",
                "loadUsersFailed": "Failed to load users",
                "loadUserFailed": "Failed to load user"
            },
            "form": {
                "username": "Username",
                "email": "Email",
                    "password" : "Password",
                "newPassword": "Password (leave blank to keep unchanged)",
                "role": "Role",
                "cannotChangeOwnRole": "You cannot change your own role",
                "save": "Save",
                "saving": "Saving...",
                "cancel": "Cancel",
                "delete": "Delete",
                "deleteConfirmText": "Delete this user permanently? This cannot be undone.",
                "yesDelete": "Yes, delete",
                "deleting": "Deleting...",
                "no": "No",
                "errors": {
                    "forbidden": "Forbidden",
                    "saveFailed": "Failed to save changes",
                    "deleteFailed": "Failed to delete user"
                }
            }
        },
        contact: {
            contact: "Contact",
            send: "Send",
            title: "Send a message to administration",
            des: "Write your message here...",
        },
        Friends: {
            social: "Social",
            friends: "Friend",
            pending: "PENDING",
            accept: "ACCEPT",
            reject: "REJECT",
            delete: "DELETE",
            empty: "No friends yet",
            cancel: "Cencel"
        }
    },

    setLanguage: async (key : LanguageType) => {
        try {
            const languageData = await fetch(`/api/edit?path=/users/language/${key}`);
            const language = await languageData.json();
            set({language: key, translations: language});
        }
        catch { }
    },
    

}))
