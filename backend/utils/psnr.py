
def weighted_psnr_420(psnr_y, psnr_cb, psnr_cr):
    return (4 * psnr_y + psnr_cb + psnr_cr) / 6