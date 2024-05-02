import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Avatar } from './avatar.schema';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  userId: string;

  @Prop()
  name: string;

  @Prop()
  job: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Avatar' }] })
  avatars: Avatar[];
}

export const UserSchema = SchemaFactory.createForClass(User);
