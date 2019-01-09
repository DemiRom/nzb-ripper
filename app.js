const https     = require('https');
const http      = require('http');
const request   = require('request'); 
const rp = require('request-promise');
const fs        = require('fs');
const { exec }  = require('child_process');
const $         = require('cheerio');

const config    = require('./config.js');

if(config.DEBUG){
    console.log("\n\n");
    console.log("CONFIG");
    console.log(config);
    console.log("\n\n");
}


///DO SOME CHECKS HERE
//TODO(Demetry): Implement configuration checking here

/**
 * This function checks if we already have this nzb downloaded. 
 * Just needs the name no extension
 *
 * @param nzb_name The name of the nzb to check
 * @returns bool
 **/
function check_exists(nzb_name){
    return fs.existsSync("nzbs/"+nzb_name+".nzb");
}

/**
 * Just making javascript better one function at a time
 * @param fn The function to execute
 * @param t The time in ms
 * @returns object
 **/
function setIntervalAndExecute(fn, t) { 
    fn();
    return (setInterval(fn, t));
}

/**
 * Copy's all the files from the download folder to the indexer
 * COPY_FROM_PATH
 * COPY_TO_PATH 
 * are used here.
 **/
function copy_nzbs_to_indexer(){
    exec(`cp -r ${config.FROM_PATH}/* ${config.TO_PATH}`, (err, stdout, stderr) => { 
        if(err) { 
            console.log(`FATAL ${err}`);
            process.exit();
            return; 
        }

        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
}

///Going to use objects to store the different indexers
var NzbGeek = { 
    query: {
        search_type: {
            TV    : "tvsearch",
            MOVIE : "movie",
            SEARCH: "search",
            BOOK  : "book"
        },
        
        category: { 
            TV: {
                ALL: "5000",
                ANIME: "5070"
            },
            MOVIE: { 
                ALL: "2000"
            },
            PC: {
                ALL: "4000"
            },
            CONSOLE: {
                ALL: "1000"
            },
            BOOK: { 
                ALL: "7000"
            }
        },

        limit: "200"
    },

    ///FUNCTIONS
    
    /**
     * Query builder for NzbGeek
     **/
    query_builder: function(search_type, category) { 
        return `${config.GEEK_API_URL}?t=${search_type}&cat=${category}&o=json&apikey=${config.GEEK_API_KEY}`;
        //

    },

    /**
     * Get all the titles from the query
     *
     * @param query The query to use
     * @param cb Callback once complete
     **/
    get_all_titles: function(query, cb){
        if(config.DEBUG)
            console.log("DEBUG QUERY: " + query);

        rp({ uri: query, json:true }).then((res) => {

            if(!res.channel)
            {
                if(config.DEBUG)
                    console.log("ERROR: Response error");
                throw "Response Error";
            }

            let items = res.channel.item;
            let ret = []; 

            for(var i = 0; i < items.length; i++)
            {
                ret.push({
                    title: items[i].title.replace(/ /g, ""),
                    link: items[i].link.replace(/amp;/g, "")
                });
            }

            cb(ret);
        }).catch((err) => { 
            if(config.DEBUG)
                console.log(err);
        });
    },

    /**
     * Check if the nzb exists and if it does not download the nzb
     *
     * @param item The item object containing the title and link
     * @param callback The callback once finished
     **/
    download_nzb: function(item, cb){
        let title = `${item.title.substr(0, 50)}-RIPPER_BOT`;
        
        if(check_exists(title))
            cb(false, title);

        let file = fs.createWriteStream(`nzbs/${title}.nzb`);
        let download = https.get(item.link, (res) => {
            res.pipe(file);
            
            cb(true, title);
        }).on('error', (err) => { 
            if(config.VERBOSE)
                console.log(`ERROR: ${err}`);
            cb(false, title);
        });
    }
    
}

var AnizDB = {
    /**
     * Process titles from AnizB.org
     *
     * @param cb Callback
     **/
    process_titles: function(cb){

        //This array holds all the titles and links
        ret = [];

        for(var i = config.ANIZ_DB_START_OFFSET; i < config.ANIZ_DB_MAX_OFFSET; i++)
        {
            let current_url = `${config.ANIZ_DB_URL}${i.toString()}00`;
            
            if(config.DEBUG)
                console.log(`DEBUG URL: ${current_url}`);

            rp({uri: current_url}).then((html) => {
                //if(config.DEBUG)
                    //console.log(html);

                

                $('td', html).each((i, ele) => {
                    for(var j = 0; j < ele.children.length; j++)
                    {
                        let tag = ele.children[j].next;
                        if(tag) {
                            if(tag.attribs) {
                                if(tag.attribs.href) {
                                    ret.push({title: "", link: `https://anizb.org/${tag.attribs.href}`});
                                    //console.log(link);
                                }
                            }
                        }
                    }
                    //console.log(ele.children[0].next.attribs);
                });

                cb(ret);
            }).catch((err) => {
                if(config.DEBUG)
                    console.log(`ERROR: ${err}`);
            });
        }
    },
    
    /**
     * Download the title
     *
     * @param url The url of the item to download
     * @param cb Callback the callback once completed
     **/
    download_title: function(url, cb){
        // RegExp to extract the filename from Content-Disposition
        var regexp = /filename=\"(.*)\"/gi;

        // initiate the download
        let req = request.get(url).on('response', function( res ){
            let filename = res.headers['content-disposition'].replace(/attachment; filename=/g, "");

            filename = filename.replace(/.nzb/g, "");
            
            //TODO(Demetry): Implement renaming regexes
            filename = `${filename.substr(0, 50)}-RIPPER_BOT`;

            if(check_exists(filename))
            {
                cb(false, filename);
                return; 
            }

            //let filename = regexp.exec(res.headers['content-disposition'])[1];
            let fws = fs.createWriteStream(`nzbs/${filename}.nzb`);
            res.pipe(fws);
            res.on( 'end', function(){
                cb(true, filename);
            });
            res.on('error', (err) => {
                if(config.DEBUG)
                    console.log(err);

                cb(false, filename);
            });
        });
    }
}
//"https://anizb.org/dl/54090/",
AnizDB.process_titles((ret) => { 
    
    for(var i = 0; i < ret.length; i++){
        //console.log(ret[i].link);
        AnizDB.download_title(ret[i].link, (downloaded, filename) => { 
            if(config.VERBOSE)
            {
                if(downloaded){
                    console.log(`DOWNLOADED: ${filename}`); 

                    //TODO(Demetry): Fix this
                    //copy_nzbs_to_indexer();

                } else {
                    console.log(`SKIPPED: ${filename}`);
                }
            }   
        });
    }
});

setIntervalAndExecute(() => {
    
    QUERIES = [
        NzbGeek.query_builder(NzbGeek.query.search_type.SEARCH, NzbGeek.query.category.TV.ALL),
        NzbGeek.query_builder(NzbGeek.query.search_type.SEARCH, NzbGeek.query.category.MOVIE.ALL)
    ];

    for(var i = 0; i < QUERIES.length; i++)
    {
        NzbGeek.get_all_titles(QUERIES[i], (res) => { 
            for(var j = 0; j < res.length; j++)
            {
                if(config.DEBUG) console.log(`TITLE: ${res[j].title}`);

                NzbGeek.download_nzb(res[i], (downloaded, title) => {
                    if(downloaded) {
                        if(config.VERBOSE){
                            console.log(`DOWNLOADED: ${title}`);

                            //TODO(Demetry): Fix this
                            //copy_nzbs_to_indexer();
                        }
                    } else {
                        if(config.VERBOSE) console.log(`SKIPPED: ${title}`);
                    }
                });
            }
        });
    }
}, config.UPDATE_TIMER);

setIntervalAndExecute(() => { 
    copy_nzbs_to_indexer();
}, config.UPDATE_TIMER);
