import React from 'react';
import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Button } from '@fluentui/react-components';

const ConfirmDialog = ({ isOpen, title, content, confirmText = '确定', cancelText = '取消', onConfirm, onCancel, isAlert = false }) => {
  return (
    <Dialog open={isOpen}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <p>{content}</p>
          </DialogContent>
          <DialogActions>
            {/* 如果是 alert 弹窗，则只显示确认按钮 */}
            {isAlert ? (
              <Button onClick={onConfirm || onCancel} appearance="primary">
                {confirmText}
              </Button>
            ) : (
              <>
                <Button onClick={onCancel} appearance="secondary">
                  {cancelText}
                </Button>
                <Button onClick={onConfirm} appearance="primary">
                  {confirmText}
                </Button>
              </>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default ConfirmDialog;
