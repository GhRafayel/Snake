import { IsNotEmpty} from "class-validator";

export class LoginUsersDto {
    @IsNotEmpty()
    "Email": string;

     @IsNotEmpty()
    "Password": string;
}