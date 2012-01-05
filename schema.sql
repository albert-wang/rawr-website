
-- Create the categories table and index
DROP TABLE blog_categories CASCADE;
DROP TABLE blog_posts CASCADE;
DROP TABLE blog_comments CASCADE;
DROP TABLE blog_tags CASCADE;
DROP TABLE blog_tag_bridge CASCADE;

CREATE TABLE IF NOT EXISTS blog_categories
    ( id        SERIAL NOT NULL UNIQUE PRIMARY KEY
    , name      VARCHAR(128) NOT NULL
    );

CREATE INDEX blog_categories_name_index ON blog_categories
    ( name
    ); 

-- Then insert the valid values into it.
-- Make sure that there are no other values in it.
INSERT INTO blog_categories(name) VALUES
    ('uncategorized'),
    ('programming'),
    ('araboth')
    ;

--The post table
CREATE TABLE IF NOT EXISTS blog_posts 
    ( id        SERIAL NOT NULL UNIQUE PRIMARY KEY
    , title     VARCHAR(128) NOT NULL
    , category  INTEGER NOT NULL REFERENCES blog_categories(id)
    , content   TEXT NOT NULL
    , time      TIMESTAMP NOT NULL
    );

--The comment table.
--Note that comments can nest within themselves.
CREATE TABLE IF NOT EXISTS blog_comments
    ( id             SERIAL NOT NULL UNIQUE PRIMARY KEY
    , parent_post    INTEGER REFERENCES blog_posts(id)
    , author         VARCHAR(128) NOT NULL
    , author_email   VARCHAR(128) NOT NULL
    , parent_comment INTEGER REFERENCES blog_comments(id)
    , content        TEXT NOT NULL
    , time           TIMESTAMP NOT NULL
    );

--Create the tag table, index, and bridge
CREATE TABLE IF NOT EXISTS blog_tags
    ( id        SERIAL NOT NULL UNIQUE PRIMARY KEY
    , name      VARCHAR(128) NOT NULL
    );

CREATE INDEX blog_tags_name_index ON blog_tags 
    ( name
    );

CREATE TABLE IF NOT EXISTS blog_tag_bridge
    ( post      INTEGER NOT NULL REFERENCES blog_posts(id)
    , tag       INTEGER NOT NULL REFERENCES blog_tags(id)
    , PRIMARY KEY (post, tag)
    );

