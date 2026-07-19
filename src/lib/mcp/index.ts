import { defineMcp } from "./lovable-stub";
import searchUsers from "./tools/search-users";
import getProfile from "./tools/get-profile";
import listTrendingVideos from "./tools/list-trending-videos";

export default defineMcp({
  name: "javan-mcp",
  title: "Javan",
  version: "0.1.0",
  instructions:
    "Tools for Javan, a short-video and creator social app. Use `search_users` to find creators by handle or name, `get_profile` to look up a specific profile, and `list_trending_videos` for the latest public videos.",
  tools: [searchUsers, getProfile, listTrendingVideos],
});
