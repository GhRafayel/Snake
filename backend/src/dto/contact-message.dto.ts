import { IsString, IsNotEmpty } from 'class-validator';

export class ContactMessageDto {
    @IsString()  @IsNotEmpty()
    "Username": string;

    @IsString()  @IsNotEmpty()
    "Email": string;

    @IsString() @IsNotEmpty()
    "message" : string;
}
