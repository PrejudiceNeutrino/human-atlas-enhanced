import * as T from 'three';
import { motionProgress } from './motion.ts';

type CameraView = NonNullable<T.PerspectiveCamera['view']>;
export interface CameraPose {
  position: T.Vector3;
  target: T.Vector3;
  view: CameraView | null;
}

export function captureCameraPose(camera: T.PerspectiveCamera, target: T.Vector3): CameraPose {
  return {
    position: camera.position.clone(),
    target: target.clone(),
    view: camera.view?.enabled ? { ...camera.view } : null,
  };
}

/** One finite camera-only return, sampled by the existing scene loop. */
export function createCameraReturn(
  camera: T.PerspectiveCamera,
  target: T.Vector3,
  from: CameraPose,
  start: number,
  duration: number,
) {
  const to = captureCameraPose(camera, target);
  const origin = new T.Spherical().setFromVector3(from.position.clone().sub(from.target));
  const destination = new T.Spherical().setFromVector3(to.position.clone().sub(to.target));
  const spherical = new T.Spherical();
  // Orbit along the shortest yaw, including a rear view or crossing +/- pi.
  const yaw = T.MathUtils.euclideanModulo(destination.theta - origin.theta + Math.PI, 2 * Math.PI) - Math.PI;
  const viewKeys = ['fullWidth', 'fullHeight', 'offsetX', 'offsetY', 'width', 'height'] as const;
  const referenceView = to.view ?? from.view;
  const neutralView = referenceView ? {
    ...referenceView, offsetX: 0, offsetY: 0,
    width: referenceView.fullWidth, height: referenceView.fullHeight,
  } : null;
  const fromView = from.view ?? neutralView, toView = to.view ?? neutralView;
  const sameView = from.view === to.view || !!(from.view && to.view && viewKeys.every(key => from.view![key] === to.view![key]));
  const stationary = from.position.distanceToSquared(to.position) < 1e-12 && from.target.distanceToSquared(to.target) < 1e-12 && sameView;

  return {
    update(now: number, reducedMotion = false) {
      const progress = motionProgress(now - start, reducedMotion || stationary ? 0 : duration);
      if (progress === 1) {
        camera.position.copy(to.position);
        target.copy(to.target);
        if (to.view) camera.setViewOffset(to.view.fullWidth, to.view.fullHeight, to.view.offsetX, to.view.offsetY, to.view.width, to.view.height);
        else camera.clearViewOffset();
      } else {
        target.lerpVectors(from.target, to.target, progress);
        spherical.set(
          T.MathUtils.lerp(origin.radius, destination.radius, progress),
          T.MathUtils.lerp(origin.phi, destination.phi, progress),
          origin.theta + yaw * progress,
        ).makeSafe();
        camera.position.setFromSpherical(spherical).add(target);
        if (fromView && toView) camera.setViewOffset(
          T.MathUtils.lerp(fromView.fullWidth, toView.fullWidth, progress),
          T.MathUtils.lerp(fromView.fullHeight, toView.fullHeight, progress),
          T.MathUtils.lerp(fromView.offsetX, toView.offsetX, progress),
          T.MathUtils.lerp(fromView.offsetY, toView.offsetY, progress),
          T.MathUtils.lerp(fromView.width, toView.width, progress),
          T.MathUtils.lerp(fromView.height, toView.height, progress),
        );
      }
      camera.lookAt(target);
      camera.updateMatrixWorld();
      return progress === 1;
    },
  };
}
