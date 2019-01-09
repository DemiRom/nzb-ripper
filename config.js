require('dotenv').config();

const config = {
    GEEK_API_KEY:         process.env.GEEK_API_KEY,
    GEEK_API_URL:         process.env.GEEK_API_URL,

    UPDATE_TIMER:         process.env.UPDATE_TIMER_MS,
    FROM_PATH:            process.env.COPY_FROM_PATH,
    TO_PATH:              process.env.COPY_TO_PATH,

    ANIZ_DB_URL:          process.env.ANIZ_DB_URL,
    ANIZ_DB_START_OFFSET: process.env.ANIZ_DB_START_OFFSET,
    ANIZ_DB_MAX_OFFSET:   process.env.ANIZ_DB_MAX_OFFSET,

    VERBOSE:      process.env.VERBOSE,
    DEBUG:        process.env.DEBUG
}

module.exports = config;
