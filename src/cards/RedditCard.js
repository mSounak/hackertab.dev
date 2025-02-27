import React, { useContext, useState, useEffect } from 'react'
import { FaReddit } from 'react-icons/fa';
import redditApi from '../services/reddit'
import CardComponent from "../components/CardComponent"
import ListComponent from "../components/ListComponent"
import { format } from 'timeago.js';
import PreferencesContext from '../preferences/PreferencesContext'
import CardLink from "../components/CardLink"
import { BiCommentDetail } from 'react-icons/bi';
import { MdAccessTime } from "react-icons/md"
import { VscTriangleUp } from 'react-icons/vsc';
import { GoPrimitiveDot } from "react-icons/go"
import { BsArrowReturnRight } from "react-icons/bs"
import CardItemWithActions from '../components/CardItemWithActions'

const formatResponsePost = (post) => {
    const { data: {
        title, subreddit, link_flair_text, link_flair_background_color,
        score, num_comments, permalink, created_utc, link_flair_text_color
    } } = post
    return { 
        title, subreddit, link_flair_text, link_flair_background_color,
        score, num_comments, permalink, created_utc, link_flair_text_color
    }
}

const PostFlair = ({ link_flair_text, link_flair_background_color, link_flair_text_color }) => {
    const color = link_flair_text_color == 'light' ? "#fff" : "#000"
    const backgroundColor = link_flair_background_color ? link_flair_background_color : "#dadada"
    return (
        <div style={{ backgroundColor, color}} className="flair">
            <span>{ link_flair_text }</span>
        </div>
    )
}

const PostItem = ({ item, index, analyticsTag }) => {
    const fullUrl = `https://www.reddit.com${item.permalink}`
    const { listingMode } = useContext(PreferencesContext)

    return (
      <CardItemWithActions
        source={"reddit"}
        index={index}
        key={index}
        item={{ ...item, url: fullUrl }}
        cardItem={
          <>
            <CardLink link={fullUrl} analyticsSource={analyticsTag}>
                { listingMode === "compact" && 
                    <div className="counterWrapper">
                        <VscTriangleUp/>
                        <span className="value">{item.score}</span>
                    </div>
                }
                
                <div className="subTitle">
                    {item.link_flair_text && <PostFlair {...item} />}
                    {item.title}
                </div>
            </CardLink>

            <div className="rowDetails">
              {listingMode === "normal" && (
                <>
                  <span className="rowItem redditRowItem">
                    <GoPrimitiveDot className="rowItemIcon" /> {item.score}{" "}
                    points
                  </span>
                  <span className="rowItem">
                    <MdAccessTime className="rowItemIcon" />{" "}
                    {format(new Date(item.created_utc * 1000))}
                  </span>
                  <span className="rowItem">
                    <BiCommentDetail className="rowItemIcon" />{" "}
                    {item.num_comments} comments
                  </span>
                  <span className="rowItem">
                    <BsArrowReturnRight className="rowItemIcon" />{" "}
                    {`r/${item.subreddit}`}
                  </span>
                </>
              ) }
            </div>
          </>
        }
      />
    );
}



function RedditCard({ analyticsTag, icon, label, withAds }) {
  const preferences = useContext(PreferencesContext)
  const { userSelectedTags } = preferences

  const [refresh, setRefresh] = useState(true)

  useEffect(() => {
    setRefresh(!refresh)
  }, [userSelectedTags])

  const fetchPosts = async () => {
    const promises = userSelectedTags.map((tag) => {
      if (tag.redditValues) {
        return redditApi.getTopPostsBySubReddit(tag.redditValues[0])
      }
      return []
    })

    const results = await Promise.allSettled(promises)
    return results
      .map((res) => {
        let value = res.value
        if (res.status === 'rejected') {
          value = []
        }
        return value.map((item) => formatResponsePost(item))
      })
      .flat()
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
  }

  const renderItem = (item, index) => (
    <PostItem item={item} key={`at-${index}`} index={index} analyticsTag={analyticsTag} />
  )

  return (
    <CardComponent
      icon={<span className="blockHeaderIcon">{icon}</span>}
      link="https://www.reddit.com/"
      title={label}>
      <ListComponent
        fetchData={fetchPosts}
        renderItem={renderItem}
        refresh={refresh}
        withAds={withAds}
      />
    </CardComponent>
  )
}

export default RedditCard