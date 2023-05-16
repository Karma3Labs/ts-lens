# Lens Recommender

Here's a typescript wrapper of the [Eigentrust Basic API](https://k3l.io/docs/api/basic/v1/) for the lens protocol. This repository includes all the essential functionality in order to successfully serve an API that is being used either for developers or for Karma3labs' [Lens front-end](https://lens.k3l.io)

## Eigentrust

Eigentrust is a reputation-based trust algorithm, commonly used in peer-to-peer systems. Eigentrust can be used in the Lens protocol to establish trust among peers and facilitate reliable user, content recommendations in both personalized and non personalized context. For understanding the implementation, 3 eigentrust concepts must my introduced. Here's an explanation of each:

### Localtrust

Localtrust is a graph representinhg the reputation or trustworthiness of a peer as perceived by another peer. This It is a local view of trust and is calculated based on the direct interactions and experiences between peers. Each peer maintains a localtrust value for every other peer it has interacted with. The localtrust value reflects the level of trust or confidence that a peer has in another peer based on their past interactions.

### Pretrust

Pretrust is an initial trust value assigned to peers when they first join the system or have no prior interactions. It is a starting point for trust calculations before any direct interactions occur. Pretrust values can be set uniformly for all peers or based on some predefined criteria or reputation estimation algorithms. Pretrust helps to establish an initial trust network and enables trust propagation among peers.

### Initial Trust:

Initial trust refers to the initial trustworthiness value assigned to each peer
when the trust algorithm begins. It represents the level of trust that a peer
initially has in itself. The initial trust value can be set uniformly for all
peers or based on certain characteristics or reputation information. It serves
as a starting point for trust calculations and influences the propagation of
trust throughout the system.

## Recommendation

By incorporating Eigentrust within the Lens Recommendation API, users can
benefit from both non-personalized and personalized recommendations, enhancing
their content and user discovery within the Lens platform.

The Lens Recommendation API utilizes the Eigentrust algorithm to provide various
recommendation endpoints:

### Non-Personalized User Recommendation (Global Rankings):

The Non-Personalized User Recommendation, also known as Global Rankings, provides a list of globally popular users. These rankings are created through different strategies as defined in the configuration file. By running the `yarn compute` command, the API calculates and caches these global rankings. Clients can subsequently access the cached global rankings for each strategy via the exposed server.

All the strategies currently supported share the same pretrust list which includes the protocol's Originals (OGs), but each strategy employs different localtrust matrices.

- `Followship`: This strategy is based solely on user followings. For every instance where user A follows user B, an edge is created in the localtrust graph with a weight of 1.

- `Engagement`: This strategy takes into account follows, mirrors, and comments to generate the localtrust. If user A interacts with user B in any of these ways, an edge is created with a weight calculated as: `follow (which is always 1) * 6 + mirrors_count * 8 + comment_count * 3`.

- `Creator`: This strategy works similarly to the Engagement strategy but also incorporates collectsNFTs. The weight of each edge is calculated as follows: `follow (which is always 1) * 6 + mirrors_count * 8 + comment_count * 3 + collectNFT_count * 12`.

Each of these strategies provides a unique perspective on user reputation, allowing for diverse and dynamic global rankings.

### Personalized User Recommendation (Who to Follow): The

The "Who to Follow" recommendation is personalized for each user. It leverages
the global rankings and the list of people that a given user follows. The API
uses the [go-eigentrust](https://k3l.io/docs/api/basic/v1/) services, utilizing
the global rankings as initial trust values and localtrust values, and
iteratively updates them based on the user's followed accounts. This process
generates personalized recommendations for users on whom to follow within the
Lens platform.

### Non-Personalized Content Recommendation (Feed):

The "Feed" recommendation is designed to provide users with non-personalized content suggestions. This service employs two distinct strategies to curate content for the user.

`Latest`: This strategy presents a live feed of the most recent posts, arranged in descending order of their posting time. It offers users a real-time view of the latest content being shared across the platform.

`Popular`: This strategy is designed to highlight the most viral posts based on an SQL-driven heuristic that takes into account mirrors, posts, and comments. The content for this feed is selected from the top 100 users as determined by the `Engagement` strategy in the global rankings.

The SQL heuristic works as follows:

- It first compiles a list of all posts from these top users.
- Next, it calculates a score for each post based on the formula: `1 * mirrors_count + 1 * collect_count + 3 * comments_count - 5 * age_hours_post`.
- Finally, it sorts the posts in descending order of their scores.

Given this formula, which factors in the popularity of each post and includes a time decay function, the Popular strategy surfaces the most viral posts from the most reputable users within the network.

### Personalized Content Recommendation (For You):

Similar to the feed, the "For You" recommendation provides personalized content
suggestions. The API applies a simple heuristic to select posts from the top
100 users based on personalized user recommendations. These recommendations are
tailored specifically to each user's preferences and interests.

## Running

- `yarn compute`. Generates localtrust using different strategies speicified in the configuration, stores it in the database and uploads it on the go-eigentrust service. Subsequently, generates and saves in the database both global rankings and the feed. This script is made to be run on interval (e.g once every couple of hours)

- `yarn serve`. Considering that the localtrust is uploaded to the go-eigentrust service and that the database is populated with global rankings and the cached feed, a server is being started that contains endpoints for every recommendation. The endpoints can be found [here](https://openapi.lens.k3l.io)
