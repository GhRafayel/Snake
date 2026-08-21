import { IsIn, IsOptional } from "class-validator";
import { UpdateUserDto } from "./updata-users.dto";

export class AdminUpdateUserDto extends UpdateUserDto {
    @IsOptional() @IsIn(["ADMIN", "PLAYER"])
    "role": "ADMIN" | "PLAYER";
}
