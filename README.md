# Sentry
*Abandon hope all ye who enter here*.

Sentry is a decrepit Discord moderation bot. Not supported and not recommended. Code has many antipatterns and poor design choices. 

Yet, some people still ask about Sentry and are interested in using it themselves or looking at the source, so here you go. This is for you. Enjoy.

Feel free to fork and make it your own. But you probably shouldn't.

## Considerations

- This moderation bot is not customizable via commmands and is very opinionated with how it works.
- This moderation bot doesn't work in more than one server at once. Each instance of this bot can only handle one server.
- The code is largely undocumented and obscure.

## Original Authors
This bot was originally created by [evaera](https://github.com/evaera) and [shayner32](https://github.com/PhoenixShay) in July of 2017.

## Configuration

Sentry expects a `.env` file in the `src` directory, with this content:

```
TOKEN=
ADMIN_ROLES=
BAN_ROLES=
GUILD_ID=
MUTED_ROLE=
MUTE_EMOJI=
MUTE_CONTEXT_EMOJI=
LOG_GUILD_ID=
LOG_JOIN=
LOG_VOICE=
LOG_CHAT=
LOG_MUTES=
LOG_KICKS=
STAFF_COMMANDS_CHANNEL=
OWNER_ID=
IGNORE_VOICE_CHANNELS=
TRIAL_MOD_ROLE=
ADVERTISEMENT_CHANNEL=
VOICE_TEXT_CHANNEL=
ANNOUNCEMENT_CHANNEL=
EVENT_CHANNEL=
CLEAR_EMOJI=
WARN_MOJI=
```

Every field expects a Discord Snowflake except for `TOKEN`. Set to `0` to disable a certain feature.
