
-- Create the categories table and index
CREATE TABLE IF NOT EXISTS blog_categories
    ( id        SERIAL NOT NULL UNIQUE PRIMARY KEY
    , name      VARCHAR(128)
    );

CREATE INDEX blog_categories_name_index ON blog_categories
    ( name
    ); 

-- Then insert the valid values into it.
-- Make sure that there are no other values in it.
DELETE FROM blog_categories;
INSERT INTO blog_categories(name) VALUES
    ('uncategorized'),
    ('programming'),
    ('araboth')
    ;

--The post table
CREATE TABLE IF NOT EXISTS blog_posts 
    ( id        SERIAL NOT NULL UNIQUE PRIMARY KEY
    , title     VARCHAR(128)
    , category  INTEGER REFERENCES blog_categories(id)
    , content   TEXT
    , time      TIMESTAMP
    );

--The comment table.
--Note that comments can nest within themselves.
CREATE TABLE IF NOT EXISTS blog_comments
    ( id             SERIAL NOT NULL UNIQUE PRIMARY KEY
    , parent_post    INTEGER REFERENCES blog_posts(id)
    , author         VARCHAR(128)
    , parent_comment INTEGER REFERENCES blog_comments(id)
    , content        TEXT
    , time           TIMESTAMP
    );

--Create the tag table, index, and bridge
CREATE TABLE IF NOT EXISTS blog_tags
    ( id        SERIAL NOT NULL UNIQUE PRIMARY KEY
    , name      VARCHAR(128)
    );

CREATE INDEX blog_tags_name_index ON blog_tags 
    ( name
    );

CREATE TABLE IF NOT EXISTS blog_tag_bridge
    ( post      INTEGER REFERENCES blog_posts(id)
    , tag       INTEGER REFERENCES blog_comments(id)
    , PRIMARY KEY (post, tag)
    );

