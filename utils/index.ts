import chalk from 'chalk'
import moment from 'moment-timezone'

// Text With Color
const color = (text:string, color:string) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text)
}

// Get Time 
const processTime = (timestamp:any, now:any) => {
    return moment.duration(now - <any>moment(<any>timestamp * 1000)).asSeconds()
}

// Check is URL
const isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi))
}

const usedCommandRecently = new Set()

const isFiltered = (from) => {
    return !!usedCommandRecently.has(from)
}

const addFilter = (from) => {
    usedCommandRecently.add(from)
    setTimeout(() => {
        return usedCommandRecently.delete(from)
    }, 5000);
}

module.exports = {
    msgFilter: {
        isFiltered,
        addFilter
    },
    processTime,
    color,
    isUrl
}