# Lens Recommender

Here's a typescript wrapper of the [Eigentrust Basic API](https://k3l.io/docs/api/basic/v1/) for the lens protocol. This repository includes all the essential functionality in order to successfully serve an API that is being used either for developers or for Karma3labs' [Lens front-end](https://lens.k3l.io)

## Eigentrust

Eigentrust is a reputation-based trust algorithm, commonly used in peer-to-peer systems. Eigentrust can be used in the Lens protocol to establish trust among peers and facilitate reliable user, content recommendations in both personalized and non personalized context. For understanding the implementation, 3 eigentrust concepts must my introduced. Here's an explanation of each:

### Localtrust

Localtrust represents the reputation or trustworthiness of a peer as perceived by another peer. It is a local view of trust and is calculated based on the direct interactions and experiences between peers. Each peer maintains a localtrust value for every other peer it has interacted with. The localtrust value reflects the level of trust or confidence that a peer has in another peer based on their past interactions.

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

This endpoint generates a global list of rankings based on different strategies
specified in the configuration file. The API computes and caches the global
rankings using the `yarn compute` command. Clients can fetch the cached global
rankings for each strategy through the exposed server.

### Personalized User Recommendation (Who to Follow): The

The "Who to Follow" recommendation is personalized for each user. It leverages
the global rankings and the list of people that a given user follows. The API
uses the [go-eigentrust](https://k3l.io/docs/api/basic/v1/) services, utilizing
the global rankings as initial trust values and localtrust values, and
iteratively updates them based on the user's followed accounts. This process
generates personalized recommendations for users on whom to follow within the
Lens platform.

### Non-Personalized Content Recommendation (Feed):

The "Feed" recommendation focuses on non-personalized content suggestions. The
API selects the most viral posts using an SQL-based heuristic that considers
mirrors, posts, and comments. To determine which users' posts to include in the
feed, the top 100 users from the global rankings are chosen. Personalized

### Content Recommendation (For You):

Similar to the feed, the "For You" recommendation provides personalized content
suggestions. The API applies a simple heuristic to select posts from the top
100 users based on personalized user recommendations. These recommendations are
tailored specifically to each user's preferences and interests.

## Running

- `yarn compute`. Generates localtrust using different strategies speicified in the configuration, stores it in the database and uploads it on the go-eigentrust service. Subsequently, generates and saves in the database both global rankings and the feed. This script is made to be run on interval (e.g once every couple of hours)

- `yarn serve`. Considering that the localtrust is uploaded to the go-eigentrust service and that the database is populated with global rankings and the cached feed, a server is being started that contains endpoints for every recommendation. The endpoints can be found [here](https://openapi.lens.k3l.io)
