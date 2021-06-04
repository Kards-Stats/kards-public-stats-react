import { Component } from 'preact';

import Loader from './loader';
import style from './style';

import Logo from '../assets/logo.svg';

import _ from 'underscore';

import JSONTree from 'react-json-tree'

import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

let uri;
if (process.env.NODE_ENV == 'production') {
  uri = 'https://kards-public-stats.herokuapp.com/';
} else {
  uri = 'http://localhost:4848/';
}

const client = new ApolloClient({
  uri: uri,
  cache: new InMemoryCache()
});

const nameReg = /^[a-zA-Z0-9-_]+[#]\d{4}$/;
const idReg = /^\d{6}$/;

const jsonTheme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#272822',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633',
};

export default class App extends Component {
  /** Gets fired when the route changes.
   *	@param {Object} event		"change" event from [preact-router](http://git.io/preact-router)
   *	@param {string} event.url	The newly routed URL
   */

  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
      hasData: false,
      loading: false,
      queued: false,
      error: '',
      data: {}
    };

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleSearchSubmit = this.handleSearchSubmit.bind(this);
    this.handleUpdateClick = this.handleUpdateClick.bind(this);
  }

  handleSearchChange(event) {
    this.setState({ searchText: event.target.value });
  }

  handleUpdateClick(event) {
    event.preventDefault();
    this.setState({
      loading: true,
      error: ''
    });
    client.mutate({
      mutation: gql`
        mutation {
          statsById(id: ${this.state.data.player.id}) {
            ... on QueueResult {
              queued
            }
            ... on Error {
              error
            }
          }
        }
      `
    }).then((result) => {
      if (result.data.statsById.__typename == 'QueueResult') {
        console.log(result);
        this.setState({
          loading: false,
          queued: result.data.statsById.queued,
          error: ''
        });
      } else if (result.data.statsById.__typename == 'Error') {
        this.setState({
          loading: false,
          hasData: false,
          queued: false,
          data: {},
          error: result.data.statsById.error
        });
      } else {
        this.setState({
          loading: false,
          hasData: false,
          queued: false,
          data: {},
          error: 'Unknown Response'
        });
      }
    }).catch((e) => {
      console.log(e);
      this.setState({
        loading: false,
        error: 'Unkown error'
      });
    });
  }

  handleSearchSubmit(event) {
    /*
{
    "data": {
        "statsByName": {
            "player": {
                "id": "499626",
                "name": "FuTBoL",
                "tag": 3801
            },
            "stats": []
        }
    }
}
    */
    event.preventDefault();
    if (this.state.searchText.match(nameReg)) {
      // Is Name
      var split = this.state.searchText.trim().split('#');
      var name = split[0];
      var tag = split[1];
      this.setState({
        loading: true,
        hasData: false,
        data: {},
        error: ''
      });
      client.query({
        query: gql`
          query {
            statsByName(name: \"${name}\", tag: ${tag}) {
              ... on Stats {
                player {
                  id
                  name
                  tag
                }
                stats {
                  stat_name
                  modified
                  stat_int
                  stat_string
                }
              }
              ... on Error {
                error
              }
            }
          }
        `
      }).then((result) => {
        console.log(result);
        if (result.data.statsByName.__typename == 'Stats') {
          var stats = {};
          for (var i = 0; i < result.data.statsByName.stats.length; i++) {
            var data = result.data.statsByName.stats[i];
            stats[data.stat_name] = {
              value: data.stat_string == null ? data.stat_int : data.stat_string,
              modified: data.modified
            }
          }
          this.setState({
            loading: false,
            hasData: true,
            queued: false,
            data: {
              player: result.data.statsByName.player,
              stats: stats
            },
            error: ''
          });
        } else if (result.data.statsByName.__typename == 'Error') {
          this.setState({
            loading: false,
            hasData: false,
            queued: false,
            data: {},
            error: result.data.statsByName.error
          });
        } else {
          this.setState({
            loading: false,
            hasData: false,
            data: {},
            error: 'Unknown Response'
          });
        }
      }).catch((e) => {
        console.log(e);
        this.setState({
          loading: false,
          hasData: false,
          queued: false,
          data: {},
          error: 'Unkown error'
        });
      });
    } else if (this.state.searchText.match(idReg)) {
      // Is Id
      this.setState({
        loading: true,
        hasData: false,
        queued: false,
        data: {},
        error: ''
      });
      client.query({
        query: gql`
          query {
            statsById(id: ${this.state.searchText}) {
              ... on Stats {
                player {
                  id
                  name
                  tag
                }
                stats {
                  stat_name
                  modified
                  stat_int
                  stat_string
                }
              }
              ... on Error {
                error
              }
            }
          }
        `
      }).then((result) => {
        if (result.data.statsById.__typename == 'Stats') {
          console.log(result);
          var stats = {};
          for (var i = 0; i < result.data.statsById.stats.length; i++) {
            var data = result.data.statsById.stats[i];
            stats[data.stat_name] = {
              value: data.stat_string == null ? data.stat_int : data.stat_string,
              modified: data.modified
            }
          }
          this.setState({
            loading: false,
            hasData: true,
            queued: false,
            data: {
              player: result.data.statsById.player,
              stats: stats
            },
            error: ''
          });
        } else if (result.data.statsById.__typename == 'Error') {
          this.setState({
            loading: false,
            hasData: false,
            queued: false,
            data: {},
            error: result.data.statsById.error
          });
        } else {
          this.setState({
            loading: false,
            hasData: false,
            queued: false,
            data: {},
            error: 'Unknown Response'
          });
        }
      }).catch((e) => {
        console.log(e);
        this.setState({
          loading: false,
          queued: false,
          error: 'Unkown error'
        });
      });
    } else {
      this.setState({
        loading: false,
        hasData: false,
        queued: false,
        error: 'Invalid player name / id format'
      });
    }
  }

  render() {
    let page, data;
    if (this.state.hasData) {
      if (this.state.data.hasOwnProperty('error')) {
        data = <div class={style.stats}>
          Error: {this.state.data.error}
        </div>;
      } else {
        console.log(this.state.data);
        if (_.isEmpty(this.state.data.stats)) {
          let text;
          if (this.state.queued) {
            text = 'Stats have been queued for an update, please refresh in a minute';
          } else {
            text = 'Stats havent been updated for this player yet';
          }
          data = <div class={style.stats}>
            <span class={style.message}>{text}</span><br/>
            <span class={style.title}>{this.state.data.player.name}</span><span class={style.tag}>#{this.state.data.player.tag}</span>
            <button class={style.search_button} onClick={this.handleUpdateClick}>
              <span class={style.button_text}>
                Update Stats
              </span>
            </button>
            <br/>
            <br/>
            <h3>Raw Data</h3>
            <JSONTree data={this.state.data} theme={jsonTheme} invertTheme={false}/>
          </div>;
        } else {
          let text;
          if (this.state.queued) {
            text = 'Stats have been queued for an update, please refresh in a minute';
          } else {
            text = '';
          }
          let seasonsData = [];
          for (var i = 1; i <= 30; i++) {
            if (this.state.data.stats.hasOwnProperty('s' + i + '_wins')) {
              console.log(this.state.data.stats['s' + i + '_wins']);
              console.log(this.state.data.stats['s' + i + '_wins'].value);
              seasonsData.push({
                name: 'Season ' + i + ' wins:',
                value: this.state.data.stats['s' + i + '_wins'].value
              });
              //seasons += <div class={style.season_entry}><span class={style.value}>Season {i} wins:</span><span class={style.value}>{this.state.data.stats['s' + i + '_wins'].value}</span><br/></div>
            }
          }
          data = <div class={style.stats}>
            <span class={style.message}>{text}</span><br/>
            <span class={style.title}>{this.state.data.player.name}</span><span class={style.tag}>#{this.state.data.player.tag}</span>
            <div class={style.section}>
              <span class={style.title}>Cardback Ranked:</span><span class={style.value}>{this.state.data.stats.cardback_ranked.value}</span><br/>
              <span class={style.title}>Elo Bump Floor:</span><span class={style.value}>{this.state.data.stats.elo_bump_floor == undefined ? 'No Rank' : this.state.data.stats.elo_bump_floor.value}</span>
            </div>
            <div class={style.section}>
              {seasonsData.map(x => (<div class={style.season_entry}><span class={style.title}>{x.name}</span><span class={style.value}>{x.value}</span><br/></div>))}
            </div>
            <div class={style.section}>
              <span class={style.title}>Current Winning Streak:</span><span class={style.value}>{this.state.data.stats.current_winning_streak.value}</span><br/>
              <span class={style.title}>Current Winning Streak Battle:</span><span class={style.value}>{this.state.data.stats.current_winning_streak_battle.value}</span><br/>
              <span class={style.title}>Current Losing Streak Battle:</span><span class={style.value}>{this.state.data.stats.current_losing_streak_battle.value}</span><br/>
            </div>
            <div class={style.section}>
              <span class={style.title}>Open Pack Bonus:</span><span class={style.value}>{this.state.data.stats.open_pack_bonus.value}</span><br/>
              <span class={style.title}>Pity Elite Counter:</span><span class={style.value}>{this.state.data.stats.pity_elite_counter.value}</span><br/>
              <span class={style.title}>Pity Elite Counter Big:</span><span class={style.value}>{this.state.data.stats.pity_elite_counter_big.value}</span><br/>
            </div>
            <div class={style.section}>
              <span class={style.title}>Total Battles Played:</span><span class={style.value}>{this.state.data.stats.total_battles_played.value}</span><br/>
              <span class={style.title}>Total Lost:</span><span class={style.value}>{this.state.data.stats.total_lost.value}</span><br/>
              <span class={style.title}>Total Wins:</span><span class={style.value}>{this.state.data.stats.total_wins.value}</span><br/>
              <span class={style.title}>Wins for Gold:</span><span class={style.value}>{this.state.data.stats.wins_for_gold.value}</span><br/>
            </div>
            <button class={style.search_button} onClick={this.handleUpdateClick}>
              <span class={style.button_text}>
                Update Stats
              </span>
            </button>
            <br/>
            <br/>
            <h3>Raw Data</h3>
            <JSONTree data={this.state.data} theme={jsonTheme} invertTheme={false}/>
          </div>;
        }
      }
    } else {
      data = <span class={style.title}>No Data</span>;
    }
    if (this.state.loading) {
      page = <Loader />;
    } else {
      page = <div class={style.main}>
        <div class={style.error}>{this.state.error}</div>
        {data}
      </div>;
    }
    return (
      <div id="app">
        <header class={style.header}>
          <div class={style.logo}>
            <img src={Logo} alt="Logo" />
          </div>
          <form onSubmit={this.handleSearchSubmit}>
            <div class={style.search_container}>
              <input type="text" placeholder="Ex. Example#1234" class={style.search_text} value={this.state.searchText} onChange={this.handleSearchChange} />
            </div>
            <button type="submit" class={style.search_button}>
              <span class={style.button_text}>
                Search  
              </span>
            </button>
          </form>
        </header>
        {page}
      </div>
    );
  }
}
