import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength} from "class-validator";

export class CreateUsersDto {
    @IsString() @IsNotEmpty()
    @MinLength(3) @MaxLength(40)
    "Username": string;

    @IsEmail()  @IsNotEmpty() @IsString() @MinLength(3) @MaxLength(40)
    "Email": string;

    @IsNotEmpty() @IsString()
    @MinLength(8) @MaxLength(128)
    "Password": string;

    "resetCode": string | null;

    "codeExpire": Date | null;
}

