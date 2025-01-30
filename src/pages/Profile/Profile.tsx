import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import CoverOne from '../../images/cover/cover-01.png';
import userSix from '../../images/user/blank.png';
import { Link } from 'react-router-dom';
import "./profile.css";
import { useAuth } from "../../context/AuthContext"

const Profile = () => {
  const { user, userData, loading, logout } = useAuth();

  return (
    <>
      <Breadcrumb pageName="Profile" />

      <div className="profile-card dark">
        <div className="profile-cover h-35 md:h-65">
          <img src={CoverOne} alt="profile cover" />
          <div className="cover-edit-btn">
            <label htmlFor="cover">
              <input type="file" name="cover" id="cover" />
              <span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4.76464 1.42638..."
                  />
                </svg>
              </span>
              <span>Edit</span>
            </label>
          </div>
        </div>
        <div className="profile-info">
          <div className="profile-picture-wrapper">
            <img src={userSix} alt="profile" />
            <label className="picture-edit-btn" htmlFor="profile">
              <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M4.76464 1.42638..."
                />
              </svg>
              <input type="file" name="profile" id="profile" />
            </label>
          </div>
          <h3><div>{userData ? (<><h1>Welcome, {userData.name}!</h1></>) : (<p>No user data found.</p>)}</div></h3>
          <p>Software Engineer</p>
          {/* <div className="profile-stats">
            <div>
              <span>259</span>
              <span className="text-sm">Posts</span>
            </div>
            <div>
              <span>129K</span>
              <span className="text-sm">Followers</span>
            </div>
            <div>
              <span>2K</span>
              <span className="text-sm">Following</span>
            </div>
          </div> */}
          <div className="about-me">
            <h4>About Me</h4>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit...
            </p>
          </div>
          <div className="follow-me">
            <div className="follow-me-icons">
              <Link to="#" aria-label="social-icon">
                <svg width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                  <path d="..." />
                </svg>
              </Link>
              <Link to="#" aria-label="social-icon">
                <svg width="23" height="22" xmlns="http://www.w3.org/2000/svg">
                  <path d="..." />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
