import {
  GraphQLFloat,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { UUIDType } from './types/uuid.js';
import { Profile } from './profile.js';
import { Post } from './post.js';
import {
  GraphQLContext,
  UserParent,
  ProfileData,
  PostData,
  UserData,
} from './types/types.js';

export const User: GraphQLObjectType = new GraphQLObjectType({
  name: 'User',
  description: 'User entity with profile, posts and subscriptions',
  fields: () => ({
    id: { type: new GraphQLNonNull(UUIDType) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    profile: {
      type: Profile,
      description: 'User profile',
      resolve: async (
        user: UserParent,
        _args,
        ctx: GraphQLContext,
      ): Promise<ProfileData | null> => {
        return ctx.prisma.profile.findUnique({
          where: { userId: user.id },
        });
      },
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Post))),
      description: 'Posts created by user',
      resolve: async (
        user: UserParent,
        _args,
        ctx: GraphQLContext,
      ): Promise<PostData[]> => {
        return ctx.prisma.post.findMany({
          where: { authorId: user.id },
        });
      },
    },
    userSubscribedTo: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      description: 'Authors this user is subscribed to',
      resolve: async (
        user: UserParent,
        _args,
        ctx: GraphQLContext,
      ): Promise<UserData[]> => {
        const links = await ctx.prisma.subscribersOnAuthors.findMany({
          where: { subscriberId: user.id },
        });
        if (!links.length) return [];
        const authorIds = links.map((link) => link.authorId);
        return ctx.prisma.user.findMany({
          where: { id: { in: authorIds } },
        });
      },
    },
    subscribedToUser: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      description: 'Users who are subscribed to this user',
      resolve: async (
        user: UserParent,
        _args,
        ctx: GraphQLContext,
      ): Promise<UserData[]> => {
        const links = await ctx.prisma.subscribersOnAuthors.findMany({
          where: { authorId: user.id },
        });
        if (!links.length) return [];
        const subscriberIds = links.map((link) => link.subscriberId);
        return ctx.prisma.user.findMany({
          where: { id: { in: subscriberIds } },
        });
      },
    },
  }),
});
