# Lens Scraper and Recommender

Here's a typescript wrapper of the [Eigentrust Basic API](https://k3l.io/docs/api/basic/v1/) for the lens protocol.

## Installation

- Pull and run the populated database from docker hub

  - `docker pull karma3labs/lens_db`
  - `docker run --name farcaster_db -p 5432:5432 -d karma3labs/lens_db`

- `cp .env.sample .env`
- Fill the .env file with the database credentials, along with the eigentrust API url.
  - For the docker container the default database credentials are `postgres`/`postgres`.
  - For the `EIGENTRUST_API` you can either call the hosted service at `https://api.k3l.io/basic/v1/` or self-host it using [this repo](https://github.com/Karma3Labs/go-eigentrust).

## Running

- Pick a pretrust strategy from the existing ones or create a new one on the file: `./recommender/strategies/pretrust.ts`. The existing pretrust strategies are:
  - `pretrustAllEqually` (default): This strategy doesn't pretrust any users. Since this is a non-personalized strategy, the eigentrust API will be called once on the initialization and the recommendation will be the same, no matter which user called the recommendation.
  - `pretrustSpecificHandles`: This strategy pretrusts only specific and hardcoded handles in the pretrust file (see the pretrustSpecificHandles function). Again, this is a non-personalized strategy, thus the globalTrust will be calculated once and will be the same for each user.
  - `pretrustFollowersOfHandle`: This strategy pretrusts the followers of the user that requested the recommendation. Since this is a personalized strategy, the Eigentrust globalTrust will be calculated on every request, and will return a different globalTrust for each different user.
- Run `yarn serve --pretrust <your_strategy>`
- The server will start on port 8080. Call the API with: `curl 'http://localhost:8080/suggest?handle=katemoss.lens'`

## Generating global trust values in CSV

- For generating all global trust values in a CSV, just run `yarn get_global_trust`.
- The script will generate a `globaltrust.csv` file in the root directory of the project.
- Feel free to adjust the pretrust strategy using the `--pretrust` argument. Note that since the eigentrust calculation will be done once, the pretrust strategy should not be personalized.
- For more info run `yarn get_global_trust --help`

## Manual scraping

- If you don't want to use the existing data from the provided docker file, you can scrape the lens data on your own by calling `yarn scrape`. Note that the data scraping procedure might take up to 12 hours.

## Populating the database manually.

- From the databse dump
  - Download the [database dump](fill me)
  - `cat lens.sql.gz | gunzip | psql -h localhost -U postgres -W -d lens`
- From the csv files
  - Download [edges.csv](fill-me) and [nodes.csv](fill-me)
  - Put them under the populater folder
  - Run `yarn populate`
