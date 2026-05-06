import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import RegisterHybrid from '../pages/auth/RegisterHybrid'
import MainLayout from '../layouts/MainLayout'
import Home from '../pages/Home'
import ClassDetail from '../pages/ClassDetail'
import ClassForumDetail from '../pages/ClassForumDetail'
import ClassForumPage from '../pages/ClassForumPage'
import ClassAssignmentsPage from '../pages/ClassAssignmentsPage'
import ClassStudentsPage from '../pages/ClassStudentsPage'
import ClassLeaderboardPage from '../pages/ClassLeaderboardPage'
import ClassAssignmentDetailPage from '../pages/ClassAssignmentDetailPage'
import ClassAssignmentEvaluationPage from '../pages/ClassAssignmentEvaluationPage'
import GeneralForumPage from '../pages/GeneralForumPage'
import GeneralForumDetailPage from '../pages/GeneralForumDetailPage'
import MyProfileInformationPage from '../pages/MyProfileInformationPage'
import MyProfileShowcasePage from '../pages/MyProfileShowcasePage'
import BecomeHybridPage from '../pages/BecomeHybridPage'
import MyProfileAccountPage from '../pages/MyProfileAccountPage'
import ClassGradesPage from '../pages/ClassGradesPage'
import Calendar from '../pages/Calendar'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-hybrid" element={<RegisterHybrid />} />
        <Route path="/login" element={<Login />} />

        <Route path="/home" element={<MainLayout>{<Home />}</MainLayout>} />
        <Route
          path="/classes/:classId"
          element={
            <MainLayout headerVariant="class">
              <ClassDetail />
            </MainLayout>
          }
        />
        <Route
          path="/classes/:classId/forum"
          element={
            <MainLayout headerVariant="class">
              <ClassForumPage />
            </MainLayout>
          }
        />

        <Route
          path="/classes/:classId/assignments"
          element={
            <MainLayout headerVariant="class">
              <ClassAssignmentsPage />
            </MainLayout>
          }
        />

        <Route
          path="/classes/:classId/assignments/:assignmentId/detail"
          element={<ClassAssignmentDetailPage />}
        />

        <Route
          path="/classes/:classId/assignments/:assignmentId/evaluate"
          element={<ClassAssignmentEvaluationPage />}
        />
        <Route
          path="/classes/:classId/students"
          element={
            <MainLayout headerVariant="class">
              <ClassStudentsPage />
            </MainLayout>
          }
        />

        <Route
          path="/classes/:classId/forum/:forumId"
          element={
            <MainLayout headerVariant="class">
              <ClassForumDetail />
            </MainLayout>
          }
        />

        <Route
          path="/classes/:classId/leaderboard"
          element={
            <MainLayout headerVariant="class">
              <ClassLeaderboardPage />
            </MainLayout>
          }
        />

        <Route
          path="/forum"
          element={
            <MainLayout>
              <GeneralForumPage />
            </MainLayout>
          }
        />

        <Route
          path="/forum/:forumId"
          element={
            <MainLayout>
              <GeneralForumDetailPage />
            </MainLayout>
          }
        />

        <Route
          path="/classes/:classId/grades"
          element={
            <MainLayout headerVariant="class">
              <ClassGradesPage />
            </MainLayout>
          }
        />

        <Route
          path="/my-profile/information"
          element={<MyProfileInformationPage />}
        />

        <Route
          path="/my-profile/showcase"
          element={<MyProfileShowcasePage />}
        />

        <Route path="/my-profile/account" element={<MyProfileAccountPage />} />
        <Route
          path="/my-profile/become-hybrid"
          element={<BecomeHybridPage />}
        />
        <Route
          path="/calendar"
          element={
            <MainLayout>
              <Calendar />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
