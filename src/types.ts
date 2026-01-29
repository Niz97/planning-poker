export type Message =
    | { Type: "SET_USERNAME"; Payload: string }
    | { Type: "SEND_MESSAGE"; Payload: string }
    | { Type: "ALL_USERS"; Payload: string[] };
