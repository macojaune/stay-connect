FROM elixir:1.17.2-alpine as build

# install build dependencies
RUN apk add --update git build-base npm python3

# prepare build dir
RUN mkdir /app
WORKDIR /app

# install hex + rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# set build ENV
ENV MIX_ENV=prod

# install dependencies
COPY mix.exs mix.lock ./
COPY config config
RUN mix do deps.get, deps.compile

# build assets
COPY assets assets
RUN npm --prefix ./assets ci --progress=false --no-audit --loglevel=error && \
    npm --prefix ./assets run deploy && \
    mix phx.digest

# compile app
COPY lib lib
RUN mix compile

# build release
RUN mix release

# prepare release image
FROM alpine:3.14.2 AS app

RUN apk add --no-cache openssl ncurses-libs bash

WORKDIR /app

RUN chown nobody:nobody /app

USER nobody:nobody

COPY --from=build --chown=nobody:nobody /app/_build/prod/rel/my_app ./

CMD ["bin/my_app", "start"]