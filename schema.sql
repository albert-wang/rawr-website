CREATE TABLE IF NOT EXISTS blog_categories
    ( id        SERIAL NOT NULL UNIQUE PRIMARY KEY
    , name      VARCHAR(128)
    );

DELETE FROM blog_categories;
INSERT INTO blog_categories(name) VALUES
    ('uncategorized'),
    ('programming'),
    ('araboth')
    ;

CREATE TABLE IF NOT EXISTS blog_posts 
    ( id        SERIAL NOT NULL UNIQUE PRIMARY KEY
    , title     VARCHAR(128)
    , category  INTEGER REFERENCES blog_categories(id)
    , content   TEXT
    , time      TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS blog_comments
    ( id             SERIAL NOT NULL UNIQUE PRIMARY KEY
    , parent_post    INTEGER REFERENCES blog_posts(id)
    , author         VARCHAR(128)
    , parent_comment INTEGER REFERENCES blog_comments(id)
    , content        TEXT
    , time           TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS blog_tags
    ( id        SERIAL NOT NULL UNIQUE PRIMARY KEY
    , name      VARCHAR(128)
    );

CREATE TABLE IF NOT EXISTS blog_tag_bridge
    ( post      INTEGER REFERENCES blog_posts(id)
    , tag       INTEGER REFERENCES blog_comments(id)
    , PRIMARY KEY (post, tag)
    );

